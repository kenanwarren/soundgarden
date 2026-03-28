import type { ManifestData, PsarcFile } from './types'

export function parseManifests(files: PsarcFile[]): ManifestData[] {
  const manifests: ManifestData[] = []

  for (const file of files) {
    if (!file.path.includes('manifests/') || !file.path.endsWith('.json')) continue
    if (file.path.endsWith('_vocals.json')) continue

    try {
      const json = JSON.parse(file.data.toString('utf8'))
      const entries = json.Entries ?? json.entries
      if (!entries) continue

      for (const key of Object.keys(entries)) {
        const entry = entries[key]
        const attrs = entry.Attributes ?? entry.attributes
        if (!attrs) continue

        manifests.push({
          attributes: {
            songName: attrs.SongName ?? attrs.songName ?? '',
            artistName: attrs.ArtistName ?? attrs.artistName ?? '',
            albumName: attrs.AlbumName ?? attrs.albumName ?? '',
            songYear: attrs.SongYear ?? attrs.songYear ?? 0,
            arrangementName: attrs.ArrangementName ?? attrs.arrangementName ?? '',
            tuning: attrs.Tuning ?? attrs.tuning ?? { string0: 0, string1: 0, string2: 0, string3: 0, string4: 0, string5: 0 },
            capo: attrs.CapoFret ?? attrs.capoFret ?? 0,
            centOffset: attrs.CentOffset ?? attrs.centOffset ?? 0,
            songLength: attrs.SongLength ?? attrs.songLength ?? 0,
            tempo: attrs.SongAverageTempo ?? attrs.songAverageTempo ?? 120,
            sngAsset: attrs.SongAsset ?? attrs.songAsset ?? '',
            persistentID: attrs.PersistentID ?? attrs.persistentID ?? key,
            fullName: attrs.FullName ?? attrs.fullName ?? key,
            arrangementType: attrs.ArrangementType ?? attrs.arrangementType ?? 0,
            chordTemplates: attrs.ChordTemplates ?? attrs.chordTemplates,
            sections: attrs.Sections ?? attrs.sections,
            phrases: attrs.Phrases ?? attrs.phrases
          },
          header: {
            dlcKey: attrs.DLCKey ?? attrs.dlcKey ?? json.ModelName ?? ''
          }
        })
      }
    } catch (err) {
      console.warn(`Failed to parse manifest: ${file.path}`, err)
    }
  }

  return manifests
}
