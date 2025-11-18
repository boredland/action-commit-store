import { Octokit as OriginalOctokit } from "@octokit/action";
import { getInput, error, setOutput, setSecret } from '@actions/core'
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import JSON from 'superjson';
import { exit } from "process";
import Encryptor from "secure-e2ee";

const Octokit = OriginalOctokit.plugin(restEndpointMethods)
const octokit = new Octokit();

const [owner, repo] = process.env.GITHUB_REPOSITORY?.split("/") ?? [null, null];

if (!owner || !repo) {
    error("could not determine owner / repo from GITHUB_REPOSITORY")
    exit(1)
}

const commit_sha = getInput('storage-commit-sha', { required: true })
const key = getInput('key', { required: true })
const value = getInput('value', { required: false }) !== '' ? getInput('value', { required: false }) : undefined
const encryptionKey = getInput('encryption-key', { required: false }) !== '' ? getInput('encryption-key', { required: false }) : undefined
const encryptor = !!encryptionKey ? new Encryptor(encryptionKey) : undefined;

const regex = /<!-- commit-storage = (.*) -->/;

type Storage = { [key: string]: unknown }

const main = async () => {
    try {
        const commit = await octokit.repos.getCommit({ owner, repo, ref: commit_sha })
    } catch {
        error(`could not find commit ${commit_sha} in this repository`)
        process.exit(1)
    }

    const commitComments = await octokit.repos.listCommentsForCommit({ owner, repo, commit_sha: commit_sha })

    const comment = commitComments.data.find(comment => comment.user?.login === 'github-actions[bot]' && comment.user.type === 'Bot')

    let currentBody = comment?.body.match(regex)?.at(1)

    setOutput("encrypted", false)
    if (encryptor && currentBody) {
        setOutput("encrypted", true)
        currentBody = await encryptor.decrypt(currentBody)
    }

    const data = JSON.parse<Storage>(currentBody ?? '{"json":{}}')

    setOutput("updated", false)

    if (value && data[key] !== value) {
        setOutput("updated", true)
        data[key] = value
    }

    if (value) {
        let dataString = JSON.stringify(data)
        if (encryptor) {
            dataString = await encryptor.encrypt(dataString)
            setOutput("encrypted", true)
        }
        let body = `<!-- commit-storage = ${dataString} -->`

        let updated;
        if (!comment)
            updated = await octokit.repos.createCommitComment({ owner, repo, commit_sha, body })

        if (comment)
            updated = await octokit.repos.updateCommitComment({ comment_id: comment.id, owner, repo, commit_sha, body })
    }

    setOutput("value", data[key])
    if (encryptor && typeof data[key] === 'string')
        setSecret(data[key] as string)
}

(async function () {
    await main();
}());
