const listeners = new Set();

/** Keep every PersonPicker on the page in sync after an inline create. */
export function watchPeople(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function announcePerson(person) {
  listeners.forEach((callback) => callback(person));
}
