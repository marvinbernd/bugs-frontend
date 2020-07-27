import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';
import { apiCallBegan } from './api';
import moment from 'moment';

const slice = createSlice({
  name: 'bugs',
  initialState: {
    list: [],
    loading: false,
    lastFetch: null,
  },
  reducers: {
    // actions => action handlers

    bugsRequested: (bugs, action) => {
      bugs.loading = true;
    },

    bugsRequestFailed: (bugs, action) => {
      bugs.loading = false;
    },

    bugsReceived: (bugs, action) => {
      bugs.list = action.payload;
      bugs.loading = false;
      bugs.lastFetch = Date.now();
    },

    // command - event
    // addBug - bugAdded
    bugAdded: (bugs, action) => {
      bugs.list.push(action.payload);
    },

    // command - event
    // resolveBug - bugResolved
    bugResolved: (bugs, action) => {
      const index = bugs.list.findIndex((bug) => bug.id === action.payload.id);
      bugs.list[index].resolved = true;
    },

    // command - event
    // assignBug - bugAssigned
    bugAssigned: (bugs, action) => {
      const index = bugs.list.findIndex((bug) => bug.id === action.payload.id);
      bugs.list[index].userId = action.payload.userId;
    },
  },
});

export const {
  bugAdded,
  bugResolved,
  bugAssigned,
  bugsReceived,
  bugsRequested,
  bugsRequestFailed,
} = slice.actions;
export default slice.reducer;

// Action Creators
const url = '/bugs';

export const loadBugs = () => (dispatch, getState) => {
  const { lastFetch } = getState().entities.bugs;

  const diffInMinutes = moment().diff(moment(lastFetch), 'minutes');

  if (diffInMinutes < 10) return;

  return dispatch(
    apiCallBegan({
      url,
      onStart: bugsRequested.type,
      onSuccess: bugsReceived.type,
      onError: bugsRequestFailed.type,
    })
  );
};

// after API call success --> update store (bugAdded)
export const addBug = (bug) =>
  apiCallBegan({
    url,
    method: 'post',
    data: bug,
    onSuccess: bugAdded.type,
  });

export const resolveBug = (id) =>
  apiCallBegan({
    url: url + '/' + id,
    method: 'patch',
    data: { resolved: true },
    onSuccess: bugResolved.type,
  });

export const assignBug = (id, userId) =>
  apiCallBegan({
    url: url + '/' + id,
    method: 'patch',
    data: { userId },
    onSuccess: bugAssigned.type,
  });

// Selector
/* export const getUnresolvedBugs = (state) =>
  state.entities.bugs.filter((bug) => !bug.resolved); */

// Memoization
// bugs => get unresolved bugs from the cache
export const getUnresolvedBugs = createSelector(
  (state) => state.entities.bugs,
  (state) => state.entities.projects,
  (bugs, projects) => bugs.list.filter((bug) => !bug.resolved)
);

export const getAssignedBugs = (userId) =>
  createSelector(
    (state) => state.entities.bugs,
    (bugs) => bugs.list.filter((bug) => bug.userId === userId)
  );
