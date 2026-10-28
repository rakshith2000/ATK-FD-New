import { appConfig } from '@/config/app-config';

type RecordType = 'incident' | 'change_request' | 'em_alert' | 'sc_request' | 'problem' | 'kb_knowledge';

const getServiceNowLink = ({ sysId, type }: { sysId: string; type: RecordType }) => `${appConfig.serviceNow.api.baseUrl}/nav_to.do?uri=${type}.do?sys_id=${sysId}`;

export default getServiceNowLink;
