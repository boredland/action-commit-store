import { Octokit as OriginalOctokit } from "@octokit/action";
import { getInput, error, setFailed } from '@actions/core'
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

const Octokit = OriginalOctokit.plugin(restEndpointMethods)
const octokit = new Octokit();

const [owner, repo] = process.env.GITHUB_REPOSITORY?.split("/") ?? [null, null];

if (!owner || !repo) {
    error("could not determine owner / repo from GITHUB_REPOSITORY")
    process.exit(0)
}

const storageCommitSha = getInput('storage-commit-sha', { required: true })
const key = getInput('key', { required: true })
const value = getInput('value', { required: true })


async () => {

    try {
        await octokit.repos.getCommit({ owner, repo, ref: storageCommitSha })
    } catch {
        error(`could not find commit ${storageCommitSha} in this repository`)
        process.exit(0)
    }

}
