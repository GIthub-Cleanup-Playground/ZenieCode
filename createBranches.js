require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_ORG_NAME;

async function createBranchInRepos(repos, branchNames) {
  try {
    if (!Array.isArray(repos)) {
      repos = [repos];
    }

    for (const repoName of repos) {
      const baseBranch = 'main';
      const baseBranchRef = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${baseBranch}`,
      });

      const sha = baseBranchRef.data.object.sha;

      if (!Array.isArray(branchNames)) {
        branchNames = [branchNames]; // If not an array, consider only one element in array. 
      }

      for (const branchName of branchNames) {
        await createBranch(repoName, branchName, sha);
      }
    }
  } catch (error) {
    console.error('Error creating branch:', error.message);
  }
}

async function createBranch(repoName, branchName, sha) {
  try {
    await octokit.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: sha,
    });
    console.log(`Branch '${branchName}' created successfully in '${repoName}'!`);
  } catch (error) {
    console.error(`Error creating branch '${branchName}' in '${repoName}':`, error.message);
  }
}

// Example usage:
const repos = ["ZY0770", "Repo01", "ZY08"];
const branchNames = ["Hello", "Hello1"]; 


// const repos = "ZY0770";
// const branchNames = "testing3";

createBranchInRepos(repos, branchNames);
