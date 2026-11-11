import Portal from '../Portal';
import { serverIdentity } from '../../lib/server-identity';
export default async function Page() {
  return <Portal area="oficina" initialUser={await serverIdentity()} />;
}
