import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { AppEager } from './app/app.eager';
import { isBad } from '@perf/perf-modes';

// Performance · change-detection: the Eager shell in bad mode. OnPush is the default since Angular 22.
bootstrapApplication(
  isBad('change-detection') ? AppEager : App,
  appConfig,
).catch((err) => console.error(err));
