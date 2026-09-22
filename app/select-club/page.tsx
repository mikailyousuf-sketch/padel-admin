import { listAccessibleClubsWithLocation } from './actions'
import SelectClubClient from './SelectClubClient'

export default async function SelectClubPage() {
  const clubs = await listAccessibleClubsWithLocation()
  return <SelectClubClient clubs={clubs} />
}