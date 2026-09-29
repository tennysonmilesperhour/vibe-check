// The account the signed-in app is showing, kept by AuthContext as sessions
// change. Writes read it the moment they are called, so a write started for
// one account names that account even if another signs in before the request
// goes out, and row-level security then refuses it.
let owner = null;

/** @param {string | null | undefined} id */
export function setOwner(id) {
  owner = id || null;
}

export function currentOwner() {
  return owner;
}
