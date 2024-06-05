require('dotenv').config();

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
// List members function
async function listMembers(owner){ // Logs login, profile picture, url and member id
        const response = await octokit.request('GET /orgs/{org}/members', {
            org:owner,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            }
          });
        //console.log(response);
        const members = response.data.map(member => ({
            login: member.login,
            avatar_url: member.avatar_url,
            url: member.url,
            id: member.id
        }));
        console.log(members)
    }
// List teams function
async function listTeams(owner) {
  try {
    const response = await octokit.request('GET /orgs/{org}/teams', {
      org: owner,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    const teams = response.data.map(team => ({
      name: team.name,
      slug: team.slug,
      url: team.url,
      id: team.id,
    }));

    console.log(teams);
  } catch (error) {
    console.error('Error listing teams:', error.message);
  }
}
