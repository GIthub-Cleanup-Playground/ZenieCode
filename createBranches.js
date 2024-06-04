require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_ORG_NAME; 

async function createBranch(repoName, branchName) {
  try {
    // Reference of base branch needed - Use getRef to get SHA value 
    const baseBranch = 'main';
    const baseBranchRef = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${baseBranch}`,
    });

    const sha = baseBranchRef.data.object.sha;

    // Create a new branch
    const response = await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: sha,
    });

    console.log(`Branch '${branchName}' created successfully in '${repoName}'!`);
  } catch (error) {
    console.error('Error creating branch:', error.message);
  }
}

createBranch("ZY0770","branchName");
