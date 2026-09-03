import appModule from "../dist/server.cjs";

const app = (appModule as any).default ?? appModule;

export default app;
