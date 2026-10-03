<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use RuntimeException;

final class NumberGenerator
{
    /**
     * Generate a human readable, sequential document number like SO-2026-0007.
     *
     * Counters live in the `document_sequences` table and are locked
     * (SELECT ... FOR UPDATE) so concurrent requests cannot collide.
     */
    public static function generate(string $key, ?int $year = null): string
    {
        $config = config("erp.sequences.{$key}");

        if (! $config) {
            throw new RuntimeException("Unknown number sequence [{$key}].");
        }

        $prefix = $config['prefix'] ?? 'DOC';
        $padding = (int) ($config['padding'] ?? 4);
        $period = (string) ($year ?? now()->year);
        $base = "{$prefix}-{$period}-";

        return DB::transaction(function () use ($key, $period, $padding, $base) {
            $now = now();

            DB::table('document_sequences')->insertOrIgnore([
                'sequence_key' => $key,
                'period' => $period,
                'number' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $row = DB::table('document_sequences')
                ->where('sequence_key', $key)
                ->where('period', $period)
                ->lockForUpdate()
                ->first();

            if (! $row) {
                throw new RuntimeException("Unable to lock number sequence [{$key}].");
            }

            $next = ((int) $row->number) + 1;

            DB::table('document_sequences')
                ->where('id', $row->id)
                ->update(['number' => $next, 'updated_at' => $now]);

            return $base.str_pad((string) $next, $padding, '0', STR_PAD_LEFT);
        });
    }
}