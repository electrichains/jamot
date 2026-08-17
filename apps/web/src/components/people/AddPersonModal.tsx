"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Field, TextInput } from "@/components/settings/section-primitives";
import type { PersonProfile } from "./people-data";

export function AddPersonModal({
  onAdd,
  onDone,
}: {
  onAdd: (person: PersonProfile) => void;
  onDone?: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const addSkill = () => {
    const value = skillDraft.trim();
    if (!value) return;
    setSkills((previous) => [...previous, value]);
    setSkillDraft("");
  };

  const save = () => {
    if (!name.trim()) return;
    onAdd({
      id: `person-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || "Team member",
      identity: {
        email: email.trim() || "no-reply@example.com",
        department: department.trim() || "General",
        location: location.trim() || "Remote",
        timezone: "UTC+1",
        reportsTo: "Andrea",
      },
      selfDescribed: {
        "In my own words": {
          value: "Newly added to the Jamot directory — profile is being built.",
          source: "self_declared",
          confidence: 0.8,
        },
      },
      integral: {},
      skills,
      experience: [],
      preferences: {
        Communication: {
          value: "Async by default.",
          source: "self_declared",
          confidence: 0.8,
        },
      },
      goals: ["Settle into the team and contribute."],
      availability: "Available · UTC+1 · 9–18",
      contributions: ["Onboarded to the people directory."],
      reputation: {
        helpfulness: 0.5,
        reliability: 0.5,
        collaboration: 0.5,
        delivery: 0.5,
      },
      memory: {
        interactions: 0,
        notes: ["Joined the Jamot directory."],
      },
    });
    onDone?.();
  };

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Add a human</h3>
        {onDone ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Close"
            onClick={onDone}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Name">
          <TextInput
            placeholder="e.g. Irene"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <TextInput
              placeholder="e.g. Partnerships Lead"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </Field>
          <Field label="Department">
            <TextInput
              placeholder="e.g. Sales"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location">
            <TextInput
              placeholder="e.g. London"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </Field>
          <Field label="Email">
            <TextInput
              placeholder="irine@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
        </div>

        <div>
          <span className="text-sm font-medium">Skills</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <TextInput
              placeholder="Add a skill…"
              value={skillDraft}
              onChange={(event) => setSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!skillDraft.trim()}
              onClick={addSkill}
            >
              <Plus className="size-4" />
              Add Skill
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button size="sm" disabled={!name.trim()} onClick={save}>
            Save person
          </Button>
        </div>
      </div>
    </Card>
  );
}