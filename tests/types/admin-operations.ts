import { useQuery, useMutation } from '@vue/apollo-composable';
import {
  GetPipelineRunPageDocument,
  GetPluginConfigStatusDocument,
  GetInstalledPluginsDocument,
  StartPluginPipelineDocument,
  UpdateServerConfigDocument,
  type GetPipelineRunPageQuery,
} from '@/__generated__/operations';

export function checkAdminOperationContracts() {
  const page = useQuery(GetPipelineRunPageDocument, { pipelineRunId: 'run-1' });
  // @ts-expect-error route arrays must be narrowed to a scalar
  page.refetch({ pipelineRunId: ['run-1'] });
  // @ts-expect-error a public pipeline selection excludes internal payload
  void page.result.value?.getPipelineRunPage?.run.jobs[0]?.payload;
  // @ts-expect-error pipeline lookup can return null
  void page.result.value?.getPipelineRunPage.run;
  const installed = useQuery(GetInstalledPluginsDocument);
  // @ts-expect-error JSON manifests need runtime validation
  void installed.result.value?.getInstalledPlugins[0]?.manifest.secrets;
  const config = useQuery(GetPluginConfigStatusDocument, { pluginId: 'scanner', version: '1' });
  // @ts-expect-error plugin versions are strings
  config.refetch({ pluginId: 'scanner', version: 1 });
  const start = useMutation(StartPluginPipelineDocument);
  // @ts-expect-error pipeline starts require target IDs
  start.mutate({ scope: 'SERVER' });
  const update = useMutation(UpdateServerConfigDocument);
  // @ts-expect-error Neo4j scalar-list updates require set/push, not a raw array
  update.mutate({ serverName: 'default', input: { pluginRegistries: ['registry'] } });
  return { page, installed, config, start, update };
}
export function checkPipelineNullableFields(page: NonNullable<GetPipelineRunPageQuery['getPipelineRunPage']>) {
  // @ts-expect-error stage message remains nullable
  const message: string = page.run.jobs[0]!.message;
  return message;
}
