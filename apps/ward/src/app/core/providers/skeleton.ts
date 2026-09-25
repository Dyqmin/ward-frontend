import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { NGX_SKELETON_LOADER_CONFIG } from 'ngx-skeleton-loader';

/**
 * Bed tiles show a skeleton until their first frame arrives. Wrapping the library token hides the
 * token and the object shape behind a name — and replaces `NgxSkeletonLoaderModule.forRoot()`.
 * `makeEnvironmentProviders` brands the result, so it only compiles at app or route level.
 */
export function provideSkeletonConfig(): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_SKELETON_LOADER_CONFIG,
      useFactory: () => ({
        animation: 'progress-dark',
        theme: { extendsFromRoot: true, backgroundColor: 'var(--card-2)', height: '1.1rem', marginBottom: '0.35rem' },
      }),
    },
  ]);
}
