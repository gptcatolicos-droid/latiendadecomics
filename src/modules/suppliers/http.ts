import { SupplierApiError } from './types';

type ApiRequestOptions = RequestInit & { timeoutMs?: number };

export async function supplierRequest<T>(url: string, options: ApiRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      const retryAfterHeader = response.headers.get('retry-after');
      const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
      let detail = '';
      try {
        const payload = await response.json() as { error?: { message?: string }; message?: string };
        detail = payload.error?.message || payload.message || '';
      } catch {
        detail = '';
      }
      const reason = response.status === 401 || response.status === 403
        ? 'La conexión necesita credenciales válidas.'
        : response.status === 429
          ? 'El proveedor limitó temporalmente las solicitudes.'
          : detail || 'El proveedor no pudo completar la solicitud.';
      throw new SupplierApiError(reason, response.status, Number.isFinite(retryAfter) ? retryAfter : undefined);
    }

    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  } catch (error) {
    if (error instanceof SupplierApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SupplierApiError('El proveedor tardó demasiado en responder.', 504);
    }
    throw new SupplierApiError('No fue posible comunicarse con el proveedor.', 502);
  } finally {
    clearTimeout(timeout);
  }
}
