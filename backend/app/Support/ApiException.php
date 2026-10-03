<?php

namespace App\Support;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

final class ApiException
{
    /**
     * Convert any throwable into a consistent JSON error payload for the API.
     */
    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], $e->status);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'message' => 'Unauthenticated. Please sign in again.',
            ], 401);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json([
                'message' => $e->getMessage() ?: 'You do not have permission to perform this action.',
            ], 403);
        }

        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            $resource = class_basename($e instanceof ModelNotFoundException ? $e->getModel() : '');

            return response()->json([
                'message' => $resource
                    ? class_basename($resource).' not found.'
                    : 'Resource not found.',
            ], 404);
        }

        if ($e instanceof BusinessRuleException) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], $e->status());
        }

        if ($e instanceof HttpExceptionInterface) {
            return response()->json([
                'message' => $e->getMessage() ?: 'Request could not be completed.',
            ], $e->getStatusCode(), $e->getHeaders());
        }

        $message = config('app.debug')
            ? ($e->getMessage() ?: 'Server error.')
            : 'Server error. Please try again.';

        return response()->json([
            'message' => $message,
            'exception' => config('app.debug') ? $e::class : null,
            'file' => config('app.debug') ? $e->getFile().':'.$e->getLine() : null,
        ], 500);
    }
}