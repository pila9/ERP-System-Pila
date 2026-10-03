<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'permissions', 'is_system'];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function hasPermission(string $permission): bool
    {
        $granted = $this->permissions ?? [];

        if (in_array('*', $granted, true)) {
            return true;
        }

        if (in_array($permission, $granted, true)) {
            return true;
        }

        // Module wildcard: "sales.*" grants every sales permission.
        $module = explode('.', $permission)[0];

        return in_array("{$module}.*", $granted, true);
    }
}