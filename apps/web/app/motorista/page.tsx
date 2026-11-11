import Portal from '../Portal';
import { serverIdentity } from '../../lib/server-identity';
export default async function Page() {
  return <Portal area="motorista" initialUser={await serverIdentity()} />;
}
