# Stage 22: Multithreading

<!--
References from Stage 16 (removed to be implemented here):

1. In xps_config.json:
   "workers": 4,

2. In struct xps_config_s (xps_config.h):
   u_int workers;

3. In xps_config_create (xps_config.c):
   config->workers = json_object_get_number(root_object, "workers");

4. In main.c:
   /* Instead of core, use cores */
   int n_cores = 0;
   xps_core_t **cores;

   /* In main() */
   /* create config, create cores, start cores */

   /* cores_create implementation ideas: */
   cores = malloc(sizeof(xps_core_t *) * config->workers);
   for (int i = 0; i < config->workers; i++) {
       xps_core_t *core = xps_core_create(config);
       if (core) {
           cores[n_cores++] = core;
       }
   }
   /* Duplicate (use dup(fd)) and add listeners to cores */
-->
