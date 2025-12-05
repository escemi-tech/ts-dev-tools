# TODO: Re-enable Prettier OXC Plugin

## Background

The `@prettier/plugin-oxc` plugin was temporarily disabled due to stability issues. The plugin was removed in migration `20250623095600-remove-prettier-oxc.ts`.

## Action Required

When a stable release of `@prettier/plugin-oxc` becomes available:

1. Create a new migration to re-add the plugin to the prettier configuration
2. Update the migration to add:
   ```json
   {
     "prettier": {
       "plugins": ["@prettier/plugin-oxc"]
     }
   }
   ```
3. Test thoroughly to ensure the plugin is stable
4. Update this file or remove it once completed

## Related Files

- Migration that added the plugin: `packages/core/src/install/migrations/20250623095500-add-prettier-oxc.ts`
- Migration that removed the plugin: `packages/core/src/install/migrations/20250623095600-remove-prettier-oxc.ts`

## References

- Prettier OXC Plugin: https://github.com/prettier/plugin-oxc
- Monitor releases: https://github.com/prettier/plugin-oxc/releases
