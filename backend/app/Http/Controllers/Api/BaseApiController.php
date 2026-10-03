<?php

namespace App\Http\Controllers\Api;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

abstract class BaseApiController
{
    use AuthorizesRequests;
    use ValidatesRequests;

    /**
     * Paginate with a sane page size cap.
     */
    protected function paginate(Request $request, $query)
    {
        $perPage = (int) $request->integer('per_page', config('erp.per_page'));
        $perPage = max(1, min($perPage, config('erp.max_per_page')));

        return $query->paginate($perPage)->withQueryString();
    }

    protected function boolFromRequest(Request $request, string $key): ?bool
    {
        if (! $request->has($key)) {
            return null;
        }

        $value = $request->query($key);

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    protected function dateFrom(Request $request, string $key): ?string
    {
        $value = $request->query($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * Wrap a plain array payload in a resource-like JSON response.
     */
    protected function ok(array $data, int $status = 200)
    {
        return response()->json(['data' => $data], $status);
    }

    protected function message(string $message, int $status = 200)
    {
        return response()->json(['message' => $message], $status);
    }

    protected function collection(AnonymousResourceCollection $resource): AnonymousResourceCollection
    {
        return $resource;
    }
}