import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { game } from "./game";
import { toast } from "react-toastify";

export const store = configureStore({
  middleware: [
    ...getDefaultMiddleware<RootState>(),
    () => next => action => {
      try {
        return next(action);
      } catch (e) {
        toast(String(e));
        console.log(e);
      }
    }
  ],
  reducer: game.reducer
});
export type RootState = ReturnType<typeof game["reducer"]>;
