import {pluralize} from './plural';

export const CERT_ISSUE_DAYS_LIMIT = 7;
export const CERT_ISSUE_PUSH_TEXT = `У вас доступен для оформления один бесплатный сертификат. \n\nВы можете оформить один сертификат бесплатно 1 раз в ${pluralize(CERT_ISSUE_DAYS_LIMIT, ['день', 'дня', 'дней'])}`;
