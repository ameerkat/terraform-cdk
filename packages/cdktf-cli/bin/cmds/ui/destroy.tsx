/* eslint-disable no-control-regex */
import React, { Fragment, useEffect, useState } from "react";
import { Text, Box } from "ink";
import Spinner from "ink-spinner";
import { DeployingElement } from "./components";
import {
  DeployingResource,
  PlannedResourceAction,
  TerraformPlan,
} from "../../../lib/models/terraform";
import { Plan } from "./diff";
import { CdktfProject, ProjectUpdates } from "../../../lib";
import { ErrorComponent } from "./components/error";
import { Confirm } from "./components/confirm";

interface DeploySummaryConfig {
  resources: DeployingResource[];
}

export const DeploySummary = ({
  resources,
}: DeploySummaryConfig): React.ReactElement => {
  const summary = resources.reduce(
    (accumulator, resource) => {
      if (accumulator[resource.applyState] !== undefined) {
        accumulator[resource.applyState] += 1;
      }

      return accumulator;
    },
    {
      destroyed: 0,
    } as any
  );

  return (
    <>
      {Object.keys(summary).map((key, i) => (
        <Box key={key}>
          {i > 0 && <Text>, </Text>}
          <Text>
            {summary[key]} {key}
          </Text>
        </Box>
      ))}
    </>
  );
};

interface DestroyConfig {
  targetDir: string;
  targetStack?: string;
  synthCommand: string;
  autoApprove: boolean;
}

export const Destroy = ({
  targetDir,
  targetStack,
  synthCommand,
  autoApprove,
}: DestroyConfig): React.ReactElement => {
  const [projectUpdate, setProjectUpdate] = useState<ProjectUpdates>();
  const [stackName, setStackName] = useState<string>();
  const [plan, setPlan] = useState<TerraformPlan>();
  const [error, setError] = useState<unknown>(null);
  const [resources, setResources] = useState<DeployingResource[]>([]);

  useEffect(() => {
    const project = new CdktfProject({
      targetDir,
      synthCommand,
      onUpdate: (event) => {
        setStackName(project.stackName || "");
        setProjectUpdate(event);
        setPlan(project.currentPlan!);

        if ("resources" in event) {
          setResources(event.resources);
        }
      },
      autoApprove,
    });

    project.destroy(targetStack).catch(setError);
  }, [setPlan, setError, setStackName, setProjectUpdate]);

  if (error) {
    return <ErrorComponent error={error} />;
  }

  if (plan && !plan.needsApply) {
    return (
      <Text>
        No changes for Stack: <Text bold>{stackName}</Text>
      </Text>
    );
  }

  switch (projectUpdate?.type) {
    case undefined: // starting
    case "synthing":
    case "synthed":
    case "diffing":
    case "diffed": {
      const status = projectUpdate?.type || "starting";
      return (
        <Box>
          <>
            <Text color="green">
              <Spinner type="dots" />
            </Text>
            <Box paddingLeft={1}>
              <Text>
                {stackName === "" ? (
                  <Text>{status}...</Text>
                ) : (
                  <Text>
                    {status}
                    <Text bold>&nbsp;{stackName}</Text>...
                  </Text>
                )}
              </Text>
            </Box>
          </>
        </Box>
      );
    }

    case "waiting for approval":
      return (
        <Box>
          <Box flexDirection="column">
            <Plan currentStackName={stackName || ""} plan={plan!} />
            <Confirm onApprove={projectUpdate.approve} />
          </Box>
        </Box>
      );

    case "destroying":
    case "destroy update":
    case "destroyed": {
      const applyActions = [
        PlannedResourceAction.UPDATE,
        PlannedResourceAction.CREATE,
        PlannedResourceAction.DELETE,
        PlannedResourceAction.READ,
      ];
      const applyableResources = resources.filter((resource) =>
        applyActions.includes(resource.action)
      );
      return (
        <Fragment>
          <Box flexDirection="column">
            <Box>
              <>
                {projectUpdate?.type !== "destroyed" ? (
                  <Text color="green">
                    <Spinner type="dots" />
                  </Text>
                ) : (
                  <></>
                )}
                <Box paddingLeft={1}>
                  <Text>Destroying Stack: </Text>
                  <Text bold>{stackName}</Text>
                </Box>
              </>
            </Box>
            <Text bold>Resources</Text>
            {applyableResources.map((resource: any) => (
              <Box key={resource.id} marginLeft={1}>
                <DeployingElement resource={resource} stackName={stackName} />
              </Box>
            ))}
            <Box marginTop={1}>
              <Text bold>Summary: </Text>
              <DeploySummary resources={applyableResources} />
              <Text>.</Text>
            </Box>
          </Box>
        </Fragment>
      );
    }
    default:
      return (
        <Text>{`Trying to render unknown state: ${projectUpdate?.type}`}</Text>
      );
  }
};
