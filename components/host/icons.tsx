type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const IconHome = ({ size }: P) => (
  <svg {...s(size)}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const IconSparkle = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
);
export const IconUser = ({ size }: P) => (
  <svg {...s(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const IconPlus = ({ size }: P) => (
  <svg {...s(size)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconGear = ({ size }: P) => (
  <svg {...s(size)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
);
export const IconBack = ({ size }: P) => (
  <svg {...s(size)} strokeWidth={2.2}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconWand = ({ size }: P) => (
  <svg {...s(size)}><path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18.5 3.5 17 5M18.5 8.5 17 7" /><path d="M3 21l11-11 1.5 1.5L4.5 22.5z" /></svg>
);
export const IconDrop = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>
);
export const IconFocus = ({ size }: P) => (
  <svg {...s(size)}><path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" /><circle cx="12" cy="12" r="3.5" /></svg>
);
export const IconVideo = ({ size }: P) => (
  <svg {...s(size)}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></svg>
);
export const IconLayers = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 3 2 8l10 5 10-5z" /><path d="M2 13l10 5 10-5" /></svg>
);
export const IconChevron = ({ size }: P) => (
  <svg {...s(size)}><path d="M9 5l7 7-7 7" /></svg>
);
export const IconShare = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 3v12M7 8l5-5 5 5" /><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
);
export const IconSearch = ({ size }: P) => (
  <svg {...s(size)}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
);
export const IconCamera = ({ size }: P) => (
  <svg {...s(size)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /><path d="M19 3v4M17 5h4" /></svg>
);
export const IconGallery = ({ size }: P) => (
  <svg {...s(size)}><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><circle cx="9" cy="9.5" r="1.6" /><path d="M20.5 16l-5-5-8 9" /></svg>
);
export const IconChat = ({ size }: P) => (
  <svg {...s(size)}><path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z" /><path d="M15 8.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></svg>
);
export const IconFaceScan = ({ size }: P) => (
  <svg {...s(size)}><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M9 14.5c1.6 1.4 4.4 1.4 6 0" /><path d="M9.5 9.5v.5M14.5 9.5v.5" /></svg>
);
export const IconVideoSpark = ({ size }: P) => (
  <svg {...s(size)}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M10 9v6l5-3z" /></svg>
);
export const IconPencil = ({ size }: P) => (
  <svg {...s(size)}><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M5 3l.6 1.5L7 5l-1.4.5L5 7l-.6-1.5L3 5l1.4-.5z" /></svg>
);
export const IconClose = ({ size }: P) => (
  <svg {...s(size)} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconExternal = ({ size }: P) => (
  <svg {...s(size)}><path d="M14 4h6v6M20 4l-8 8" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
export const IconShareNodes = ({ size }: P) => (
  <svg {...s(size)}><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="M8.2 10.8l7.6-4M8.2 13.2l7.6 4" /></svg>
);
export const IconHelp = ({ size }: P) => (
  <svg {...s(size)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" /><path d="M12 17h.01" /></svg>
);
export const IconSupport = ({ size }: P) => (
  <svg {...s(size)}><path d="M4 4h16v12H9l-5 4z" /><path d="M12 7.5v4M12 13.5h.01" /></svg>
);
export const IconDoc = ({ size }: P) => (
  <svg {...s(size)}><rect x="5" y="3.5" width="14" height="17" rx="1.5" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></svg>
);
export const IconEdit = ({ size }: P) => (
  <svg {...s(size)}><path d="M4 20l1-4L16 5l3 3L8 19z" /></svg>
);
