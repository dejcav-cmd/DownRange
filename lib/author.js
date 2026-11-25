// Public-facing byline for DownRange content. Change the name/role here (and in
// the generator prompts) if the byline ever needs to change again.
export const TEAM_NAME = 'DownRange Co. Intel Desk'
export const TEAM_ROLE = 'Editorial Team, DownRange Co.'
export const TEAM_AVATAR = '/img/logo.png'

// Older posts stored in Sanity still carry the previous personal byline. Map any
// of those (and empty values) to the team byline at render time so no content
// migration is needed.
const PERSONAL = /cavalcanti|^dj\b/i
export function displayAuthor(a) {
  if (!a || PERSONAL.test(String(a))) return TEAM_NAME
  return a
}
export function displayRole(role, author) {
  if (!author || PERSONAL.test(String(author)) || /founder/i.test(String(role || ''))) return TEAM_ROLE
  return role || TEAM_ROLE
}
