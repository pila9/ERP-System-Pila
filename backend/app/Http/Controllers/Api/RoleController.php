<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\RoleResource;
use App\Models\Role;
use App\Support\Perm;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Role::query()
            ->withCount('users')
            ->when($request->filled('search'), function ($q) use ($request) {
                $like = '%'.$request->query('search').'%';
                $q->where(fn ($sub) => $sub->where('name', 'like', $like)->orWhere('slug', 'like', $like));
            })
            ->orderBy('name');

        return RoleResource::collection($this->paginate($request, $query));
    }

    /**
     * Permission catalogue for the role editor UI.
     */
    public function permissions()
    {
        return $this->ok([
            'modules' => Perm::MODULES,
            'grouped' => Perm::grouped(),
            'all' => Perm::all(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:roles,slug'],
            'description' => ['nullable', 'string', 'max:190'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string'],
        ]);

        $role = Role::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'description' => $data['description'] ?? null,
            'permissions' => $this->sanitizePermissions($data['permissions']),
        ]);

        return RoleResource::make($role->loadCount('users'))->response()->setStatusCode(201);
    }

    public function show(Role $role)
    {
        return RoleResource::make($role->loadCount('users'));
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:80'],
            'slug' => ['sometimes', 'required', 'string', 'max:80', 'alpha_dash', Rule::unique('roles', 'slug')->ignore($role->id)],
            'description' => ['nullable', 'string', 'max:190'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string'],
        ]);

        if ($role->is_system && isset($data['permissions'])) {
            abort(422, 'Permissions of a system role cannot be changed.');
        }

        if (isset($data['permissions'])) {
            $data['permissions'] = $this->sanitizePermissions($data['permissions']);
        }

        $role->fill($data)->save();

        return RoleResource::make($role->loadCount('users'));
    }

    public function destroy(Role $role)
    {
        if ($role->is_system) {
            abort(422, 'System roles cannot be deleted.');
        }

        if ($role->users()->exists()) {
            abort(422, 'This role is still assigned to users.');
        }

        $role->delete();

        return $this->message('Role deleted.');
    }

    /**
     * @param  array<int,string>  $permissions
     * @return array<int,string>
     */
    private function sanitizePermissions(array $permissions): array
    {
        $valid = Perm::all();

        return array_values(array_unique(array_filter(
            $permissions,
            fn ($p) => $p === '*' || $p === '*.*' || in_array($p, $valid, true)
        )));
    }
}