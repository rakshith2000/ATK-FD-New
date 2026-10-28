import RichTextEditor from '@/shared/modules/rich-text-editor/RichTextEditor';
import TestAlerts from '@/modules/dev-temp-space/pages/TestSpace/TestAlearts';
import TestErrorBaundary from '@/modules/dev-temp-space/pages/TestErrorBaundary/TestErrorBaundary';
import VirtualTableDemo from '@/modules/dev-temp-space/pages/VirtualTableDemo/VirtualTableDemo';
import SampleForm from '@/modules/dev-temp-space/pages/SampleForm/SampleForm';
import ImageWithUnknownExt from '@/shared/components/ui/ImageWithUnknowExt/ImageWithUnknowExt';
import { resolvePublicAssetPath } from '@/shared/utils/resolve-public-asset-path';
import logger from '@/shared/utils/logger';
import RenderMarkdown from '@/shared/components/smart/RenderMarkdown/RenderMarkdown';
import { useEffect, useState } from 'react';
import { TextInput } from '@/shared/components/ui/InputFields';
import { useAuth } from '@/shared/modules/auth/hooks/useAuth';
import './MSAccountDetails/MSAccountDetails.css';
import CopyText from '@/shared/components/ui/CopyText/CopyText';
import UnAuthorisedAccess from '@/shared/components/ui/UnAuthorisedAccess/UnAuthorisedAccess';
import { moduleLandingCardsMeta } from '@/shared/components/ui/LandingCard/contants/module-landing-cards-meta';
import LandingCard from '@/shared/components/ui/LandingCard/LandingCard';
import { noop } from '@tanstack/react-table';
import DynamicFormExample from '@/shared/modules/dynamic-form/__tests__/DynamicFormExample';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorPlaceholder, LoadingPlaceholder } from '@/shared/components/ui/Placeholders';
import DynamicFormRenderer from '@/modules/admin-portal/modules/form-builder/components/smart/DynamicFormRenderer/DynamicFormRenderer';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorBoundaryFallback from '@/shared/components/ui/ErrorBoundaryFallback/ErrorBoundaryFallback';
import UpdateIncidentForm from '@/modules/incident-ai/components/smart/UpdateIncidentForm/UpdateIncidentForm_Hybrid';
import ChatBot from '@/shared/components/smart/ChatBot/ChatBot';
import type { QuickMessage } from '@/shared/components/smart/ChatBot/ChatBot';
import TransferList from '@/shared/components/ui/TransferList/TransferList';
import type { TransferListItem } from '@/shared/components/ui/TransferList/TransferList';
import globalAlertToastEventBus from '@/shared/components/smart/GlobalAlertToast/global-alert-toast-event-bus';
import globalAlertDialogEventBus from '@/shared/components/smart/GlobalAlertDialog/global-alert-dialog-event-bus';
import FormActionButton from '@/shared/components/ui/FormActionButton/FormActionButton';
import { appConfig, type AppConfig } from '@/config/app-config';
import ModalExamples from './ModalExamples/ModalExamples';
import EmptyBoxPlaceholderExample from './LoaderExamples/EmptyPlaceholderExample';
import ErrorSVGExample from './LoaderExamples/ErrorSVGExample';
import SpinnerLoaderExample from './LoaderExamples/SpinningLoaderExample';
import SnowTicketAttachmentActions from '@/shared/modules/servicenow/components/SnowTicketAttachmentActions/SnowTicketAttachmentActions';
import { useFormConfigByNameQuery } from '@/modules/admin-portal/modules/form-builder/hooks/useFormConfigByNameQuery';

const TRANSFER_LIST_ITEMS: TransferListItem[] = [
    { key: 'short_description', label: 'Short Description', description: 'string • required' },
    { key: 'state', label: 'State', description: 'choice' },
    { key: 'priority', label: 'Priority', description: 'integer' },
    { key: 'assignment_group', label: 'Assignment Group', description: 'reference -> sys_user_group' },
    { key: 'assigned_to', label: 'Assigned To', description: 'reference -> sys_user' },
    { key: 'category', label: 'Category', description: 'string' },
    { key: 'subcategory', label: 'Subcategory', description: 'string' },
    { key: 'work_notes', label: 'Work Notes', description: 'journal' },
    { key: 'close_notes', label: 'Close Notes', description: 'string' },
    { key: 'due_date', label: 'Due Date', description: 'glide_date_time' },
    { key: 'cmdb_ci', label: 'Configuration Item', description: 'reference -> cmdb_ci' },
    { key: 'impact', label: 'Impact', description: 'integer' },
];

function FormCodeLoader() {
    const [code, setCode] = useState('');
    const [activeCode, setActiveCode] = useState<string>('Incident Form');

    const formConfigQuery = useFormConfigByNameQuery(activeCode);

    const handleLoad = () => code.trim() && setActiveCode(code.trim());

    return (
        <>
            <div className="flex items-end gap-2 mb-4 w-full max-w-md">
                <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] font-medium text-gray-500">Form Code</label>
                    <TextInput
                        value={code}
                        onChange={setCode}
                        placeholder="e.g. post, update-ticket, feature-showcase"
                        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleLoad()}
                    />
                </div>
                <button
                    type="button"
                    onClick={handleLoad}
                    disabled={!code.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Load Form
                </button>
            </div>
            {activeCode && (
                <ErrorBoundary
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <ErrorBoundaryFallback error={error as Error} description={JSON.stringify(error)} reset={resetErrorBoundary} />
                    )}
                >
                    {formConfigQuery.isLoading ? <LoadingPlaceholder /> : null}
                    {formConfigQuery.isError ? (
                        <ErrorPlaceholder error={formConfigQuery.error} isRefetching={formConfigQuery.isRefetching} onRetry={formConfigQuery.refetch} />
                    ) : null}
                    {formConfigQuery.data ? (
                        <div className="flex-1 min-h-0 shadow w-full p-4 justify-center items-center rounded-lg">
                            <span className="text-xs font-medium text-gray-600">{formConfigQuery.data.name}</span>
                            <DynamicFormRenderer
                                record={formConfigQuery.data}
                                meta={{
                                    postId: 10,
                                    ticketType: 'incident',
                                    ticketId: '7f7e9079fb597e10dd3ffa656eefdcd5',
                                    environment: 'prod',
                                    productId: 1,
                                }}
                            />
                        </div>
                    ) : null}
                </ErrorBoundary>
            )}
        </>
    );
}

function TransferListDemo() {
    const [selected, setSelected] = useState<TransferListItem[]>([TRANSFER_LIST_ITEMS[0], TRANSFER_LIST_ITEMS[1]]);
    return (
        <div className="max-w-3xl border border-slate-200 rounded-lg p-4 bg-white">
            <TransferList
                available={TRANSFER_LIST_ITEMS}
                selected={selected}
                onChange={setSelected}
                availableTitle="Available Fields"
                selectedTitle="Selected Fields"
                searchPlaceholder="Search fields..."
            />
            <p className="text-[10px] text-gray-400 mt-2">Selected: {selected.map((s) => s.key).join(', ') || '(none)'}</p>
        </div>
    );
}

const SAMPLE_QUICK_MESSAGES: QuickMessage[] = [
    { label: 'Check server status', message: 'What is the current server status?' },
    { label: 'Recent incidents', message: 'Show me recent incidents' },
    { label: 'Run diagnostics', message: 'Run a full system diagnostics check' },
];

const DevTestSpacePage: React.FC = () => {
    const { state: authState, getAccessToken, getRefreshToken, refreshToken, revokeAccessToken, revokeRefreshToken, getUserSnowDetails } = useAuth();

    const [accessTokenValue, setAccessTokenValue] = useState('');
    const [refreshTokenValue, setRefreshTokenValue] = useState('');

    useEffect(() => {
        getRefreshToken()
            .then((t) => setRefreshTokenValue(t))
            .catch((err) => setRefreshTokenValue('Error fetching refresh token: ' + JSON.stringify(err)));
    }, []);

    useEffect(() => {
        getAccessToken()
            .then((t) => setAccessTokenValue(t))
            .catch((err) => setAccessTokenValue('Error fetching access token: ' + JSON.stringify(err)));
    }, []);

    const [savedHtml, setSavedHtml] = useState('');

    const techAssitNotResponse =
        "Reference KB Articles - \nNo relevant knowledge articles found in respository. However, you can try below solution - \n\nCreating a knowledge article for addressing a ransomware alert involves several steps, including identifying the threat, assessing the impact, and implementing a response strategy. Here's a step-by-step guide with relevant commands and examples:\n\n---\n\n## Knowledge Article: Responding to Ransomware Alert for 5624_sample.exe\n\n### Introduction\nThis article provides a detailed response strategy for handling a ransomware alert triggered by Morpheus Ransomware Detection for the process `5624_sample.exe`. It includes identification, containment, eradication, recovery, and preventive measures.\n\n### Step 1: Identification\n- Alert Details:\n  - Process ID/Name: `5624_sample.exe`\n  - Detection Score: `0.527191401`\n  - Snapshot Timestamp: `2022-01-30_10-27-02.100283`\n\n#### Command Example:\nTo verify the process details, use:\n```bash\nps -aux | grep 5624_sample.exe\n```\n\n### Step 2: Containment\n- Isolate the infected system to prevent further spread.\n- Disconnect the network cable or disable Wi-Fi.\n\n#### Command Example:\nTo isolate the system, disable network interfaces:\n```bash\nsudo ifconfig eth0 down\nsudo ifconfig wlan0 down\n```\n\n### Step 3: Eradication\n- Terminate the malicious process.\n- Delete the malicious executable.\n\n#### Command Example:\nTo kill the process and remove the file:\n```bash\nsudo kill -9 <PID>\nsudo rm /path/to/5624_sample.exe\n```\n\n### Step 4: Recovery\n- Restore from backups if available.\n- Ensure backups are clean before restoring.\n\n#### Command Example:\nTo restore from a backup:\n```bash\nrsync -av /backup/location /restore/location\n```\n\n### Step 5: Preventive Measures\n- Update all systems with the latest security patches.\n- Implement endpoint protection solutions.\n\n#### Command Example:\nTo update the system:\n```bash\nsudo apt update && sudo apt upgrade\n```\n\n### Step 6: Monitoring and Reporting\n- Enable continuous monitoring for suspicious activities.\n- Report the incident to relevant authorities.\n\n#### Command Example:\nTo set up monitoring:\n```bash\nsudo apt install tripwire\ntripwire --init\ntripwire --check\n```\n\n### Conclusion\nBy following these steps, you can effectively respond to a ransomware alert and minimize its impact. Always ensure your systems are updated and have robust security measures in place to prevent future incidents.\n\n---\n\nThis article provides a comprehensive approach to handling ransomware alerts with practical examples and commands tailored for technical users.";

    const revokeRefreshTokenMutation = useMutation({
        mutationFn: revokeRefreshToken,
        onSuccess: () => {
            globalAlertToastEventBus.emit('show-alert-toast', {
                title: 'Refresh token revoked successfully',
                description: 'The refresh token has been revoked successfully.',
                severity: 'success',
                position: 'top-center',
            });
        },
        onError: (error) => {
            globalAlertDialogEventBus.emit('show-dialog', {
                title: 'Error revoking refresh token',
                note: `An error occurred while revoking the refresh token: ${JSON.stringify(error)}`,
                severity: 'error',
            });
        },
    });

    const revokeAccessTokenTokenMutation = useMutation({
        mutationFn: revokeAccessToken,
        onSuccess: () => {
            globalAlertToastEventBus.emit('show-alert-toast', {
                title: 'Access token revoked successfully',
                description: 'The access token has been revoked successfully.',
                severity: 'success',
                position: 'top-center',
            });
        },
        onError: (error) => {
            globalAlertDialogEventBus.emit('show-dialog', {
                title: 'Error revoking access token',
                note: `An error occurred while revoking the access token: ${JSON.stringify(error)}`,
                severity: 'error',
            });
        },
    });

    const refreshAccessTokenTokenMutation = useMutation({
        mutationFn: refreshToken,
        onSuccess: (token) => {
            setAccessTokenValue(token);
            globalAlertToastEventBus.emit('show-alert-toast', {
                title: 'Access token refreshed successfully',
                description: 'The access token has been refreshed successfully.',
                severity: 'success',
                position: 'top-center',
            });
        },
        onError: (error) => {
            globalAlertDialogEventBus.emit('show-dialog', {
                title: 'Error refreshing access token',
                note: `An error occurred while refreshing the access token: ${JSON.stringify(error)}`,
                severity: 'error',
            });
        },
    });

    const userSnowDetails = useQuery({
        queryFn: getUserSnowDetails,
        queryKey: ['getUserSnowDetails'],
    });

    logger.debug('appConfig : ', Object.getOwnPropertyNames(appConfig));

    const formConfigQuery = useFormConfigByNameQuery('Incident Form');

    return (
        <div className="h-full overflow-scroll">
            <div className="p-4 pt-0">
                <div className="debug-section">
                    <h3>Form Config (Debug)</h3>
                    <>
                        {formConfigQuery?.isLoading ? <LoadingPlaceholder /> : null}
                        {formConfigQuery?.isError ? (
                            <ErrorPlaceholder error={formConfigQuery?.error} isRefetching={formConfigQuery?.isRefetching} onRetry={formConfigQuery?.refetch} />
                        ) : null}
                        <pre className="debug-code">{JSON.stringify(formConfigQuery?.data, null, 2)}</pre>
                    </>
                </div>
                <div className="debug-section">
                    <h3>App Config Data (Debug)</h3>
                    {Object.getOwnPropertyNames(appConfig).map((key) => {
                        const data = appConfig?.[key as keyof AppConfig];
                        return (
                            <>
                                <h3 className="uppercase">{key} :</h3>
                                <pre className="debug-code">{JSON.stringify(data, null, 2)}</pre>
                            </>
                        );
                    })}
                </div>
                <div className="debug-section">
                    <h3>User Snow Details </h3>
                    <pre className="debug-code">
                        {userSnowDetails?.isLoading ? 'Loading ...' : null}
                        {userSnowDetails?.isError ? 'Error...' : null}
                        {userSnowDetails?.data ? JSON.stringify(userSnowDetails?.data) : null}
                    </pre>
                </div>

                <div className="debug-section">
                    <h3>Raw Auth State Data (Debug)</h3>
                    <pre className="debug-code">{JSON.stringify(authState, null, 2)}</pre>
                </div>

                <div className="debug-section">
                    <h3>Auth User Details (Debug)</h3>
                    <pre className="debug-code">{JSON.stringify(authState?.user, null, 2)}</pre>
                </div>
                <div className="debug-section">
                    <h3 className="flex gap-5 items-center">
                        <span>Auth User Access Token</span>
                        <span>
                            <FormActionButton
                                isSubmitting={refreshAccessTokenTokenMutation.isPending}
                                label="Refresh Access Token"
                                submittingLabel="Firing..."
                                onClick={() => refreshAccessTokenTokenMutation.mutate()}
                                variant="primary"
                                className="max-w-max min-w-0"
                            />
                        </span>
                        <span>
                            <FormActionButton
                                isSubmitting={revokeAccessTokenTokenMutation.isPending}
                                label="Revoke Access Token"
                                submittingLabel="Firing..."
                                onClick={() => revokeAccessTokenTokenMutation.mutate()}
                                variant="danger"
                                className="max-w-max min-w-0"
                            />
                        </span>
                    </h3>
                    <pre className="debug-code">
                        <CopyText text={accessTokenValue} />
                    </pre>
                </div>
                <div className="debug-section">
                    <h3 className="flex gap-5 items-center">
                        <span>Auth User Refresh Token</span>
                        <span>
                            <FormActionButton
                                isSubmitting={revokeRefreshTokenMutation.isPending}
                                label="Revoke Refresh Token"
                                submittingLabel="Firing..."
                                onClick={() => revokeRefreshTokenMutation.mutate()}
                                variant="danger"
                                className="max-w-max min-w-0"
                            />
                        </span>
                    </h3>
                    <pre className="debug-code">
                        <CopyText text={refreshTokenValue} />
                    </pre>
                </div>
            </div>
            <div className="mt-4 p-4 flex gap-4 flex-wrap">
                <div className="min-w-full lg:min-w-[50%]">
                    <h1 className="text-sm font-semibold mb-2">Sample Form</h1>
                    <div className="max-w-200 min-h-0 border border-slate-200 rounded-lg overflow-hidden">
                        <SampleForm />
                    </div>
                </div>

                <div className="mt-4 p-4">
                    <h1 className="text-sm font-semibold mb-2">ImageWithUnknownExt (public asset resolution test)</h1>
                    <div className="flex items-center gap-4">
                        <ImageWithUnknownExt
                            baseSrcWithoutFileExtension={resolvePublicAssetPath('/brand-logo')}
                            fallbackSrc={resolvePublicAssetPath('/assets/shared/missing-image.svg')}
                            alt="brand-log"
                            style={{
                                height: '150px',
                                maxWidth: '250px',
                            }}
                        />

                        <span className="text-xs text-slate-500">Should load brand-logo from remote in MFE mode</span>
                    </div>
                </div>
            </div>
            <div>
                <DynamicFormExample />
            </div>
            <div>
                <UnAuthorisedAccess goBack goHome message="Your are not authorised to access any of the available prompt libraries !" />
            </div>
            <div className="mt-6 px-4 pb-8">
                <div className="mb-3 flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <div>
                        <h1 className="text-base font-bold text-slate-900 tracking-tight">ServiceNow Attachment Component Demo</h1>
                        <p className="text-xs text-slate-500 font-medium">Click Attachments button to open popover for direct upload or 7xl modal file download table.</p>
                    </div>
                    <SnowTicketAttachmentActions title="Incident Attachments" tableName="incident" tableSysId="70affd003be66a1457a74f0864e45aa0" />
                </div>
            </div>
            <div className="flex flex-row flex-wrap gap-4 p-4">
                {moduleLandingCardsMeta.map((meta, i) => {
                    return (
                        <LandingCard
                            id={`${meta.id}-${i}`}
                            key={`${meta.title}-${i}`}
                            agents={meta.agents}
                            features={meta.features}
                            circleBg={meta.circleBg}
                            description={meta.description}
                            iconBasePath={meta.iconBasePath}
                            title={meta.title}
                            variant={meta.variant}
                            onClick={noop}
                        />
                    );
                })}
            </div>
            <div className="mt-4 px-4">
                <VirtualTableDemo />
            </div>
            <div className="mt-4 p-4 w-200">
                <h1>Tech Assit bot Message Markdown Test</h1>
                <RenderMarkdown text={techAssitNotResponse} />
            </div>
            <div className="p-4">
                <h3>Split Button Style</h3>
                <button className="btn-split split-blue text-base py-1 px-8 rounded">
                    <span>Button</span>
                </button>
            </div>
            <div className="p-4">
                <h3>Test Modal</h3>
                <ModalExamples />
            </div>
            <div className="mt-4 p-4">
                <TestAlerts />
                <TestErrorBaundary />
                <RichTextEditor
                    initialHtml={`<!DOCTYPE html>
                    <html lang=\"en\">

                    <head>
                        <meta charset=\"UTF-8\">
                        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
                        <title>Resolving Anomaly Observed on WindowsCPUUsed Metric</title>
                        <link href=\"https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css\" rel=\"stylesheet\">
                        <style>
                            body {
                                background-color: white;
                            }

                            h1,
                            h2,
                            h3 {
                                color: blue;
                            }

                            p,
                            li {
                                font-size: 1rem;
                            }
                        </style>
                    </head>

                    <body>
                        <div class="container my-4">
                            <h1 style="white-space: no-wrap;">Resolving Anomaly Observed on WindowsCPUUsed Metric</h1>
                            <section>
                                <h2>Summary</h2>
                                <p>An anomaly was detected in the WindowsCPUUsed metric with a confidence score of 59.0. The observed metric value was 6.503, which is outside the expected range of 0.701 to 4.344. This document provides steps to address and resolve this anomaly.</p>
                            </section>
                            <section>
                                <h2>Step-by-Step Instructions</h2>
                                <h3>1. Verify the Anomalous Metric</h3>
                                <ul>
                                    <li>Access the monitoring dashboard where the WindowsCPUUsed metric is logged.</li>
                                    <li>Check the historical data to confirm that the anomaly is not an isolated incident.</li>
                                </ul>
                                <p>Validating the data ensures the anomaly is genuine and not a result of a temporary spike or logging error.</p>
                                <h3>2. Investigate Potential Causes</h3>
                                <ul>
                                    <li>Review recent changes in the system such as updates, patches, or new deployments that could have affected CPU usage.</li>
                                    <li>Check for scheduled tasks or processes running during the time of anomaly.</li>
                                </ul>
                                <p>Understanding the root cause helps in formulating an appropriate response to mitigate the issue.</p>
                                <h3>3. Implement Corrective Measures</h3>
                                <ul>
                                    <li>If a process is consuming excessive CPU, consider optimizing the code or scaling resources appropriately.</li>
                                    <li>Set up alerts to monitor CPU usage more closely in the future.</li>
                                </ul>
                                <p>Taking corrective actions will help in maintaining optimal system performance and prevent future anomalies.</p>
                            </section>
                            <section>
                                <h2>Validation Steps</h2>
                                <p>Post-resolution, confirm that CPU usage is within the expected range by continuously monitoring the metric. Ensure no further anomalies are detected over a defined period.</p>
                            </section>
                            <section>
                                <h2>Troubleshooting</h2>
                                <p>If anomalies persist, consider involving system architects for a deeper analysis of the infrastructure and workloads.</p>
                            </section>
                            <section>
                                <h2>Related Links or Articles</h2>
                                <ul>
                                    <li><a href="#" class="text-primary">Understanding CPU Usage Metrics</a></li>
                                    <li><a href="#" class="text-primary">Best Practices for Resource Monitoring</a></li>
                                </ul>
                            </section>
                        </div>
                        <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
                        <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"></script>
                        <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
                    </body>

                    </html>`}
                    onSave={(html) => {
                        setSavedHtml(html);
                        logger.debug(html);
                    }}
                    preserveInitialHtml={{
                        classes: true,
                        head: true,
                        styles: true,
                    }}
                />
                {savedHtml ? (
                    <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <h3 className="text-sm font-semibold mb-2">Saved HTML in parent state</h3>
                        <textarea className="w-full min-h-120 p-3 text-xs font-mono bg-white border border-slate-200 rounded" readOnly value={savedHtml} />
                    </div>
                ) : null}
            </div>
            <div className="mt-4 flex justify-start items-start flex-col px-4">
                <h1 className="text-sm font-semibold mb-2">Dynamic Forms Testing - Load by Code</h1>
                <FormCodeLoader />
            </div>
            <div className="mt-4 px-4">
                <h1 className="text-sm font-semibold mb-2">TransferList Component Demo</h1>
                <TransferListDemo />
            </div>
            <div className="mt-4 flex justify-start items-start flex-col max-w-140 px-4 min-h-40">
                <h1>Dynamic Forms Testing : Update SNOW Ticket Replica for the Original</h1>
                <UpdateIncidentForm incidentData={{}} incidentId="7f7e9079fb597e10dd3ffa656eefdcd5" />
            </div>
            <div className="mt-4 px-4">
                <h1 className="text-sm font-semibold mb-2">ChatBot Demo</h1>
                <div className="max-w-200 h-120 border border-slate-200 rounded-lg overflow-hidden">
                    <ChatBot
                        systemMessage="Hello! I'm a demo assistant. How can I help you today?"
                        quickMessages={SAMPLE_QUICK_MESSAGES}
                        sendMessage={async ({ userMessage }) => {
                            await new Promise((r) => setTimeout(r, 3500));
                            return { response: `Echo: ${userMessage}`, conversation_history: [] };
                        }}
                    />
                </div>
            </div>
            <div className="p-1">
                {' '}
                <SpinnerLoaderExample />
            </div>
            <div className="p-1">
                <EmptyBoxPlaceholderExample />
            </div>
            <div className="p-1">
                {' '}
                <ErrorSVGExample />
            </div>
        </div>
    );
};

export default DevTestSpacePage;
