import { configureStore } from "@reduxjs/toolkit";
import { game } from "./game";

export const store = configureStore({ reducer: game.reducer });
export type RootState = ReturnType<typeof store["getState"]>;
