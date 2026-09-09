type EraseRecords = () => PromiseLike<{ data: unknown; error: unknown }>;
type DeleteIdentity = () => PromiseLike<{ error: unknown }>;

/** The data RPC commits before Auth deletion; preserve that fact on partial failure. */
export async function deleteVibeAccount(eraseRecords: EraseRecords, deleteIdentity: DeleteIdentity) {
  let result;
  try { result = await eraseRecords(); }
  catch { return { status: 500, body: { error: 'Your Vibe Check data could not be deleted. Please try again.' } }; }
  if (result.error) return { status: 500, body: { error: 'Your Vibe Check data could not be deleted. Please try again.' } };
  if (result.data === true) return { status: 200, body: { deleted: true, sharedAccountRetained: true } };
  if (result.data !== false) return { status: 500, body: { error: 'Account deletion returned an unexpected result. Please contact support.' } };
  try {
    const { error } = await deleteIdentity();
    if (!error) return { status: 200, body: { deleted: true, sharedAccountRetained: false } };
  } catch { /* Data is already erased, even if Auth is temporarily unavailable. */ }
  return { status: 500, body: { recordsDeleted: true, error: 'Your Vibe Check records were deleted, but sign-in removal did not finish. Contact support if you need help removing the remaining sign-in.' } };
}
