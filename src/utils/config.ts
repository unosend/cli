import Conf from 'conf';

interface Config {
  apiKey: string;
  apiUrl: string;
}

const conf = new Conf<Config>({
  projectName: 'unosend',
  defaults: {
    apiKey: '',
    apiUrl: 'https://www.unosend.co',
  },
});

export function getConfig(): Config {
  return {
    apiKey: conf.get('apiKey'),
    apiUrl: conf.get('apiUrl'),
  };
}

export function setConfig(key: keyof Config, value: string): void {
  conf.set(key, value);
}

export function clearConfig(): void {
  conf.clear();
}

export function hasApiKey(): boolean {
  return !!conf.get('apiKey');
}
