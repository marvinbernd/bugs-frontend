import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

import {
  loadBugs,
  addBug,
  resolveBug,
  getUnresolvedBugs,
  assignBug,
  getAssignedBugs,
} from '../bugs';
import configureStore from '../configureStore';

describe('bugsSlice', () => {
  let fakeAxios;
  let store;

  beforeEach(() => {
    fakeAxios = new MockAdapter(axios);
    store = configureStore();
  });

  const bugsSlice = () => store.getState().entities.bugs;

  const createState = () => ({
    entities: {
      bugs: {
        list: [],
      },
    },
  });

  it('should add the bug to the store if it is saved to the server', async () => {
    // Arrange
    const bug = { description: 'a' };
    const savedBug = { ...bug, id: 1 };
    fakeAxios.onPost('/bugs').reply(200, savedBug);

    // Act
    await store.dispatch(addBug(bug));

    // Assert
    expect(bugsSlice().list).toContainEqual(savedBug);
  });

  it('should not add the bug to thes store if it is not saved to the server', async () => {
    // Arrange
    const bug = { description: 'a' };
    fakeAxios.onPost('/bugs').reply(500);

    // Act
    await store.dispatch(addBug(bug));

    // Assert
    expect(bugsSlice().list).toHaveLength(0);
  });

  it('should mark the bug as resolved if it is saved to the server', async () => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(200, { id: 1, resolved: true });

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).toBe(true);
  });

  it('should not mark the bug as resolved if it is not saved to the server', async () => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(500);

    await store.dispatch(addBug({}));
    await store.dispatch(resolveBug(1));

    expect(bugsSlice().list[0].resolved).not.toBe(true);
  });

  it('should assign the bug if it is assigned on the server', async () => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(200, { id: 1, userId: 1 });

    await store.dispatch(addBug({}));
    await store.dispatch(assignBug(1, 1));

    expect(bugsSlice().list[0].userId).toBe(1);
  });

  it('should not assign the bug if it is not assigned on the server', async () => {
    fakeAxios.onPost('/bugs').reply(200, { id: 1 });
    fakeAxios.onPatch('/bugs/1').reply(500);

    await store.dispatch(addBug({}));
    await store.dispatch(assignBug(1, 1));

    expect(bugsSlice().list[0].userId).not.toBe(1);
  });

  // - loading bugs
  //   - if the bugs exist in the cache
  //     * they should not be fetched from the server again
  //   - if the bugs do not exist in the cache
  //     * they should be fetched from the server and put in the store
  //     - loading indicator
  //       * should be true while fetching
  //       * should be false after bugs are fetched
  //       * should be false if the server fails
  describe('loading bugs', () => {
    describe('if the bugs exist in the cache', () => {
      it('they should not be fetched from the server again', async () => {
        fakeAxios.onGet('/bugs').reply(200, [{ id: 1 }]);

        await store.dispatch(loadBugs());
        await store.dispatch(loadBugs());

        expect(fakeAxios.history.get.length).toBe(1);
      });
    });

    describe('if the bugs do not exist in the cache', () => {
      it('they should be fetched from the server and put in the store', async () => {
        fakeAxios.onGet('/bugs').reply(200, [{ id: 1 }]);

        await store.dispatch(loadBugs());

        expect(bugsSlice().list).toHaveLength(1);
      });

      describe('loading indicator', () => {
        it('should be true while fetching', () => {
          fakeAxios.onGet('/bugs').reply(() => {
            expect(bugsSlice().loading).toBe(true);
            return [200, [{ id: 1 }]];
          });

          store.dispatch(loadBugs());
        });

        it('should be false after bugs are fetched', async () => {
          fakeAxios.onGet('/bugs').reply(200, [{ id: 1 }]);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });

        it('should be false if the server fails', async () => {
          fakeAxios.onGet('/bugs').reply(500);

          await store.dispatch(loadBugs());

          expect(bugsSlice().loading).toBe(false);
        });
      });
    });
  });

  describe('selectors', () => {
    it('getUnresolvedBugs', () => {
      const state = createState();
      state.entities.bugs.list = [
        { id: 1, resolved: true },
        { id: 2 },
        { id: 3 },
      ];

      const unresolvedBugs = getUnresolvedBugs(state);

      expect(unresolvedBugs).toHaveLength(2);
    });

    it('getAssignedBugs', () => {
      const state = createState();
      state.entities.bugs.list = [
        { id: 1, userId: 1 },
        { id: 2, userId: 1 },
        { id: 3, userId: 2 },
      ];

      const assignedBugs = getAssignedBugs(1)(state);

      expect(assignedBugs).toHaveLength(2);
    });
  });
});
