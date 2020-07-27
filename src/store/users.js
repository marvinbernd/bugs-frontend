import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'users',
  initialState: [
    {
      id: 1,
      name: 'Mosh Hamedani',
    },
    {
      id: 2,
      name: 'Marvin Bernd',
    },
  ],
});

export default slice.reducer;
