import React from 'react';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';

const ROWS = [
  { aspect: 'What it sees', folder: 'Files', vault: 'Projects: folder, artwork, BPM, key, tags, notes' },
  { aspect: 'When it uploads', folder: 'Continuously, even mid-save', vault: 'When you push' },
  { aspect: 'Conflicts', folder: '"Conflicted copy" files', vault: 'Per-file status before you push or pull' },
  { aspect: 'Sharing', folder: 'Links to files', vault: 'Project invites with roles' },
  { aspect: 'Listening', folder: 'Generic preview', vault: 'In-app player with waveform' },
];

const FOLDER = 'A cloud folder';
const VAULT = 'Cadencea Vault';

/** Home "Why not just Dropbox?": a table from md, one card per row below it. */
export default function CompareTable() {
  return (
    <section className="border-b border-line py-20 lg:py-28">
      <Container>
        <SectionHeader
          title="Why not just Dropbox?"
          subtitle="Cloud folders sync files. Cadencea Vault understands projects."
        />

        <table className="mt-12 hidden w-full border-collapse text-left text-sm md:table">
          <thead>
            <tr className="border-b border-line-strong">
              <td className="w-1/4 py-3 pr-6" />
              <th scope="col" className="w-[37.5%] py-3 pr-6 font-semibold text-ink-muted">
                {FOLDER}
              </th>
              <th scope="col" className="w-[37.5%] py-3 font-semibold text-ink">
                {VAULT}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((row) => (
              <tr key={row.aspect}>
                <th scope="row" className="py-4 pr-6 font-semibold text-ink">
                  {row.aspect}
                </th>
                <td className="py-4 pr-6 text-ink-muted">{row.folder}</td>
                <td className="py-4 font-medium text-ink">{row.vault}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="mt-10 space-y-4 md:hidden">
          {ROWS.map((row) => (
            <li key={row.aspect} className="rounded-md border border-line p-4">
              <h3 className="text-sm font-semibold text-ink">{row.aspect}</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-ink-subtle">{FOLDER}</dt>
                  <dd className="text-ink-muted">{row.folder}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-subtle">{VAULT}</dt>
                  <dd className="font-medium text-ink">{row.vault}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
