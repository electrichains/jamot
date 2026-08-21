"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppShell } from "@/components/app-shell/app-shell-context";
import {
  deleteModel,
  getModels,
  putModel,
  type ApiModelConfig,
  type ModelProviderId,
} from "@/lib/api-client";
import { Card, Field, SectionHeading, TextInput } from "./section-primitives";

const PROVIDERS: { id: ModelProviderId; label: string; defaultModel: string }[] = [
  { id: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
  { id: "anthropic", label: "Anthropic", defaultModel: "claude-3-5-sonnet-latest" },
];

function ProviderRow({
  provider,
  config,
  organizationId,
  disabled,
  onSaved,
}: {
  provider: (typeof PROVIDERS)[number];
  config: ApiModelConfig | null;
  organizationId: string | null;
  disabled: boolean;
  onSaved?: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? "");
  const [model, setModel] = useState(config?.model ?? provider.defaultModel);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await putModel({
        provider: provider.id,
        organizationId,
        baseUrl: baseUrl || null,
        model: model || null,
        apiKey: apiKey || undefined,
      });
      setApiKey("");
      onSaved?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save model configuration.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteModel({ provider: provider.id, organizationId });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not remove model configuration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium">{provider.label}</p>
        {config?.configured ? (
          <Badge>Configured</Badge>
        ) : (
          <Badge variant="secondary">Not set</Badge>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <Field label="API key" hint="Stored encrypted. Leave blank to keep the existing key.">
          <TextInput
            type="password"
            autoComplete="off"
            placeholder="sk-… / ant-…"
            value={apiKey}
            disabled={disabled || busy}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </Field>
        <Field label="Base URL" hint="Optional. Defaults to the provider endpoint.">
          <TextInput
            placeholder="https://api.openai.com/v1"
            value={baseUrl}
            disabled={disabled || busy}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
        </Field>
        <Field label="Model" hint="Optional. Defaults to the provider's recommended model.">
          <TextInput
            placeholder={provider.defaultModel}
            value={model}
            disabled={disabled || busy}
            onChange={(event) => setModel(event.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!disabled ? (
          <div className="flex justify-end gap-2">
            {config?.configured ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void remove()}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            ) : null}
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function ModelsSection() {
  const { space } = useAppShell();
  const organizationId = space.organizationId ?? null;
  const isAdmin = space.role === "owner" || space.role === "admin";

  const [userConfigs, setUserConfigs] = useState<Record<ModelProviderId, ApiModelConfig> | null>(null);
  const [orgConfigs, setOrgConfigs] = useState<Record<ModelProviderId, ApiModelConfig> | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  const reload = useCallback(() => {
    (async () => {
      try {
        const data = await getModels(organizationId ?? undefined);
        setUserConfigs(data.user);
        setOrgConfigs(data.organization);
        setConfigVersion((v) => v + 1);
      } catch {
        // ignore — render empty state
      }
    })();
  }, [organizationId]);

  useEffect(() => {
    const cancelled = { current: false };
    void (async () => {
      await reload();
      if (cancelled.current) return;
    })();
    return () => {
      cancelled.current = true;
    };
  }, [reload]);

  return (
    <div>
      <SectionHeading
        title="Models"
        description="Configure the AI providers Jamot uses for chat and automation. Keys are stored encrypted and never shown again."
      />

      <div className="flex flex-col gap-8">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Personal</h3>
          <div className="flex max-w-xl flex-col gap-4">
              {PROVIDERS.map((provider) => (
                <ProviderRow
                  key={`personal:${provider.id}:${configVersion}`}
                  provider={provider}
                  config={userConfigs?.[provider.id] ?? null}
                  organizationId={null}
                  disabled={false}
                  onSaved={reload}
                />
              ))}
          </div>
        </div>

        {organizationId ? (
          <div>
            <h3 className="mb-3 text-sm font-semibold">
              Organization{isAdmin ? "" : " (view only)"}
            </h3>
            {!isAdmin ? (
              <p className="mb-3 max-w-xl text-sm text-muted-foreground">
                Only organization admins can change these keys.
              </p>
            ) : null}
            <div className="flex max-w-xl flex-col gap-4">
                {PROVIDERS.map((provider) => (
                  <ProviderRow
                    key={`org:${provider.id}:${configVersion}`}
                    provider={provider}
                    config={orgConfigs?.[provider.id] ?? null}
                    organizationId={organizationId}
                    disabled={!isAdmin}
                    onSaved={reload}
                  />
                ))}
            </div>
          </div>
        ) : null}

        {userConfigs === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : null}
      </div>
    </div>
  );
}
