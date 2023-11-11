export function invariantResponse(
  condition: any,
  error: string,
  responseInit: ResponseInit = {},
): asserts condition {
  if (!condition) {
    throw new Response(error, { status: 500, ...responseInit });
  }
}
