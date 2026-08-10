// supabase.functions.invoke() throws a generic
// "Edge Function returned a non-2xx status code" error. This helper pulls the
// actual JSON error message out of the response body so users see something useful.
export async function edgeErrorMessage(error: any, fallback = "Something went wrong."): Promise<string> {
  try {
    const res: Response | undefined = error?.context;
    if (res && typeof res.json === "function") {
      const body = await res.clone().json();
      const msg = body?.error || body?.message;
      if (msg) return String(msg);
    }
  } catch {
    /* body not JSON — fall through */
  }
  return error?.message || fallback;
}
