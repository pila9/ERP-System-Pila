<?php

namespace App\Support;

use Exception;

/**
 * Thrown when an operation is blocked by a business rule
 * (illegal state transition, insufficient stock, duplicate document, ...).
 */
class BusinessRuleException extends Exception
{
    protected int $status = 422;

    protected array $errors = [];

    public function __construct(string $message = 'Operation not allowed.', array $errors = [], int $status = 422)
    {
        parent::__construct($message);

        $this->errors = $errors;
        $this->status = $status;
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function status(): int
    {
        return $this->status;
    }
}