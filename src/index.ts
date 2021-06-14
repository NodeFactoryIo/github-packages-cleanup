import { getInput, setFailed, setOutput } from "@actions/core";
import { getOctokit } from "@actions/github";
import { OctokitResponse } from "@octokit/types"
import { FetchPackagesResponse } from "./types";

const excludedVersion = getInput('excluded_versions', { required: false });
const numberOfVersionsToKeep = Number(getInput('num_versions_to_keep', { required: true }));
const packageName = getInput('package_name', { required: true });
const token = getInput('token', { required: true });
const username = getInput('username', { required: false });
const organization = getInput('organization', { required: false });


const octokit = getOctokit(token);

async function main() {
  try {
    // delete packages with token auth
    if (token && !username && !organization) {
      const fetchedPackages = await getAuthUserPackageVersions();
      const packagesToDelete = filterOutPackages(fetchedPackages);
      packagesToDelete.forEach(async (element) => {
        const output = await deleteAuthUserPackageVersions(element!.id);
        setOutput('DELETED_PACKAGES', output);
      });
      // delete user packages
    } else if (token && username && !organization) {
      const fetchedPackages = await getUserPackageVersions();
      const packagesToDelete = filterOutPackages(fetchedPackages);
      packagesToDelete.forEach(async (element) => {
        const output = await deleteUserPackageVersions(element!.id);
        setOutput('DELETED_PACKAGES', output);
      });
      // delete organization packages
    } else if (token && !username && organization) {
      const fetchedPackages = await getOrganizationPackageVersions();
      const packagesToDelete = filterOutPackages(fetchedPackages);
      packagesToDelete.forEach(async (element) => {
        const output = await deleteOrganizationPackageVersions(element!.id);
        setOutput('DELETED_PACKAGES', output);
      });
    } else {
      setFailed("Failed to fetch packages");
    }
  } catch (e) {
    console.error(`Deleting package failed because of: ${e}`);
  }
}

async function getAuthUserPackageVersions(): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('GET /user/packages/{package_type}/{package_name}/versions', {
    package_type: 'container',
    package_name: packageName,
  });
}

async function deleteAuthUserPackageVersions(packageId: number): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}', {
    package_type: 'container',
    package_name: packageName,
    package_version_id: packageId
  });
}

async function getUserPackageVersions(): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('GET /users/{username}/packages/{package_type}/{package_name}/versions', {
    package_type: 'container',
    package_name: packageName,
    username: username
  });
}

async function deleteUserPackageVersions(packageId: number): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
    package_type: 'container',
    package_name: packageName,
    username: username,
    package_version_id: packageId
  });
}

async function getOrganizationPackageVersions(): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
    package_type: 'container',
    package_name: packageName,
    org: organization
  });
}

async function deleteOrganizationPackageVersions(packageId: number): Promise<OctokitResponse<FetchPackagesResponse[], number>> {
  return await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
    package_type: 'container',
    package_name: packageName,
    org: organization,
    package_version_id: packageId
  });
}

function filterOutPackages(existingPackages: OctokitResponse<FetchPackagesResponse[], number>): (FetchPackagesResponse | undefined)[] {
  return existingPackages.data.map((item) => {
    // find package versions matching regex
    if (!item.metadata?.container?.tags[0]?.match(excludedVersion)) {
      return item;
    };
  })
    // filter out undefined values
    .filter(item => item)
    // packages for deletion - omitting last n values
    .slice(0, length - numberOfVersionsToKeep);
}

main();
