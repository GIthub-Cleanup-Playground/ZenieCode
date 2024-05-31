require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

async function createRepoFromTemplate(repoName, repoDesc, owner, templateOwner, templateRepo, users) {
    
        
        const createResponse = await octokit.request('POST /repos/{template_owner}/{template_repo}/generate', {
            template_owner: templateOwner,
            template_repo: templateRepo,
            owner: owner,
            name: repoName,
            description: repoDesc,
            include_all_branches: true,
            private: false,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });

        const newRepoFullName = createResponse.data.full_name;
        

        
        const issuesResponse = await octokit.issues.listForRepo({
            owner: templateOwner,
            repo: templateRepo,
        });

        for (const issue of issuesResponse.data) {
            const { title, body, labels, assignees } = issue;
            await octokit.issues.create({
                owner: owner,
                repo: repoName,
                title: title,
                body: body,
                labels: labels,
                assignees: assignees,
            });
        }

        console.log('Issues moved to the new repository:', newRepoFullName);

        
        for (const { username, permission } of users) {
            await octokit.repos.addCollaborator({
                owner: owner,
                repo: repoName,
                username: username,
                permission: permission,
            });
        }

        console.log('Users granted access to the new repository:', users);
        console.log('Repository created:', newRepoFullName);
}

const users = [
    { username: 'themanvendra08', permission: 'push' },
    { username: 'themanvendra00', permission: 'pull' },
    { username: 'Dheeraj-pal', permission: 'admin' }
];

createRepoFromTemplate('ZY010', 'Hello World!', 'GIthub-Cleanup-Playground', 'GIthub-Cleanup-Playground', 'Hello-World', users);
