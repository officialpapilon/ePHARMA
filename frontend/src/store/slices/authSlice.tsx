// src/store/slices/authSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { error: null as string | null },
  reducers: {
    setError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setError } = authSlice.actions;
export default authSlice.reducer;