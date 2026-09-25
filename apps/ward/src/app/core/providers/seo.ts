import {
  EnvironmentProviders,
  InjectionToken,
  Service,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

interface SeoDefaults {
  siteName: string;
}

const SEO_DEFAULTS = new InjectionToken<SeoDefaults>('SEO_DEFAULTS');

/** Nurses keep several tabs open: the tab for bed 3 reads "ICU-3 · Ward Monitor". */
@Service({ autoProvided: false })
class WardTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly defaults = inject(SEO_DEFAULTS);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const parts: string[] = [];
    // every titled route on the active branch, deepest first: "Drug and dose · ICU-3 · Ward Monitor"
    for (
      let route: RouterStateSnapshot['root'] | null = snapshot.root;
      route;
      route = route.firstChild
    ) {
      const t = this.getResolvedTitleForRoute(route) as string | undefined;
      if (t && parts[0] !== t) parts.unshift(t);
    }
    this.title.setTitle([...parts, this.defaults.siteName].join(' · '));
    this.meta.updateTag({ name: 'robots', content: 'noindex' }); // internal clinical tool
  }
}

/** A provider that replaces framework behaviour: Angular's TitleStrategy becomes ours. */
export function provideAppSeo(defaults: SeoDefaults): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: SEO_DEFAULTS, useValue: defaults },
    { provide: TitleStrategy, useClass: WardTitleStrategy },
  ]);
}
