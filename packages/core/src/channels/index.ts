export {
  createChannelRegistry,
  type ChannelAdapter,
  type ChannelKind,
  type ChannelRegistry,
  type InboundMessage,
} from "./channel.js";
export { createChannelService } from "./service.js";
export type {
  ChannelEventBus,
  ChannelService,
  ChannelServiceDeps,
} from "./service.js";
export { createWhatsAppAdapter } from "./whatsapp.js";
export type {
  WaChat,
  WaConnection,
  WaContact,
  WaMediaInput,
  WaMessage,
  WaState,
  WhatsAppAdapter,
  WhatsAppAdapterOpts,
} from "./whatsapp.js";
export { createMatrixAdapter } from "./matrix.js";
export type { MatrixAdapterOpts } from "./matrix.js";
export { createWhatsAppControlServer } from "./wa-server.js";
export type {
  WhatsAppControlServer,
  WhatsAppControlServerOpts,
} from "./wa-server.js";