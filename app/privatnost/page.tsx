import type { Metadata } from "next"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Privatnost" }

// PRD §6 "Privatnost" and §8 `/privatnost`; no law articles and no deadlines (rule 7).
// The contact address is the team's reply-to address, read from env, never written in the repo.

type DemoPhoto = {
  title: string
  author: string
  license: { name: string; url?: string }
  fileUrl: string
}

// scripts/demo-photos/CREDITS.md (ticket 21). Only street_light-2.jpg (CC BY 4.0) legally needs
// the attribution; the others are listed too, for transparency.
const DEMO_PHOTOS: DemoPhoto[] = [
  {
    title: "Švehlova, pod mostem Jižní spojky, rozbitá lampa (01).jpg",
    author: "ŠJů, Wikimedia Commons",
    license: { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
    fileUrl:
      "https://commons.wikimedia.org/wiki/File:%C5%A0vehlova,_pod_mostem_Ji%C5%BEn%C3%AD_spojky,_rozbit%C3%A1_lampa_(01).jpg",
  },
  {
    title: "A pothole in Dilova Street in Kyiv.jpg",
    author: "Роман Рябенко",
    license: { name: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
    fileUrl: "https://commons.wikimedia.org/wiki/File:A_pothole_in_Dilova_Street_in_Kyiv.jpg",
  },
  {
    title: "Pothole in Villeray, Montréal.jpg",
    author: "Miguel Tremblay",
    license: { name: "javno dobro" },
    fileUrl: "https://commons.wikimedia.org/wiki/File:Pothole_in_Villeray,_Montr%C3%A9al.jpg",
  },
  {
    title: "Umgestürzte Laterne vor dem Rathaus Düsseldorf, 13 März 2024 (1).JPG",
    author: "Kürschner",
    license: { name: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
    fileUrl:
      "https://commons.wikimedia.org/wiki/File:Umgest%C3%BCrzte_Laterne_vor_dem_Rathaus_D%C3%BCsseldorf,_13_M%C3%A4rz_2024_(1).JPG",
  },
  {
    title: "Basurero-bahia-peran-asturias.jpg",
    author: "AsturiasVerde",
    license: { name: "javno dobro" },
    fileUrl: "https://commons.wikimedia.org/wiki/File:Basurero-bahia-peran-asturias.jpg",
  },
  {
    title: "Poland. Trash 001.JPG",
    author: "Albertyanks",
    license: { name: "javno dobro" },
    fileUrl: "https://commons.wikimedia.org/wiki/File:Poland._Trash_001.JPG",
  },
  {
    title: "Une bouche d'égout ouverte à Saint-Maurice-de-Beynost en décembre 2020.jpg",
    author: "Benoît Prieur",
    license: { name: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
    fileUrl:
      "https://commons.wikimedia.org/wiki/File:Une_bouche_d%27%C3%A9gout_ouverte_%C3%A0_Saint-Maurice-de-Beynost_en_d%C3%A9cembre_2020.jpg",
  },
  {
    title: "WiesbadenBahnhofsplatzSalzbachkanalAbstiegsöffnung.JPG",
    author: "Brühl",
    license: { name: "javno dobro" },
    fileUrl:
      "https://commons.wikimedia.org/wiki/File:WiesbadenBahnhofsplatzSalzbachkanalAbstiegs%C3%B6ffnung.JPG",
  },
]

const linkClass = "font-medium text-primary underline underline-offset-4 break-words"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm leading-relaxed">{children}</CardContent>
    </Card>
  )
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 className="font-heading text-2xl font-semibold">Privatnost</h1>

      <Section title="Koje podatke prikupljamo">
        <p>
          Za nalog: ime, prezime, mejl i šifru. Ime i prezime su obavezni pri registraciji, a šifru
          ne vidi niko iz tima.
        </p>
        <p>
          Za prijavu: fotografije problema, lokaciju koju potvrdite pinom na mapi, adresu izvedenu iz
          te lokacije, vrstu i opis problema.
        </p>
        <p>
          Za podršku: da je vaš nalog ili vaša sesija u pregledaču podržala prijavu. Za podršku nalog
          nije potreban.
        </p>
      </Section>

      <Section title="Šta je javno">
        <p>
          Javno se vide fotografija, vrsta i opis problema, lokacija, status i broj podrški, kao i
          vremenska linija prijave. Poruke u vremenskoj liniji potpisuje institucija, ne ime
          službenika.
        </p>
        <p>
          Vaše ime, mejl i nalog nijesu javni, kao ni to ko je podržao prijavu. Prijava je javna čim
          je poslata, bez prethodnog odobravanja; tim Fixit može je kasnije sakriti.
        </p>
        <p>
          Opis problema je javan, zato u njega ne upisujte ime, broj telefona, mejl ni druge lične
          podatke.
        </p>
      </Section>

      <Section title="Šta dostavljamo instituciji">
        <p>
          Nadležnoj instituciji šaljemo dopis sa fotografijama, vrstom i opisom problema, lokacijom i
          adresom.
        </p>
        <p>
          Vaše ime, prezime i mejl dostavljamo samo ako pri slanju te prijave uključite „Dostavi moje
          ime i mejl instituciji“. Izbor važi samo za tu prijavu i podrazumijevano je isključen.
        </p>
      </Section>

      <Section title="Fotografije">
        <p>
          Prije otpremanja fotografije se smanjuju u vašem pregledaču, a pritom se brišu svi
          metapodaci, uključujući GPS lokaciju i model telefona. Lokacija prijave je samo tačka koju
          potvrdite pinom.
        </p>
        <p>
          Fotografije čuvamo u privatnom skladištu i prikazujemo ih preko kratkotrajnih linkova.
          Izbjegavajte lica i registarske tablice na fotografiji. Ako se na fotografiji vide, tim
          Fixit može sakriti fotografiju ili cijelu prijavu.
        </p>
      </Section>

      <Section title="Uklanjanje fotografije ili prijave">
        <p>
          Ako želite da uklonimo fotografiju ili prijavu, javite se timu Fixit odgovorom na dopis i
          navedite broj prijave (npr. FX-2026-00142).
        </p>
      </Section>

      <Section title="Demo fotografije">
        <p>
          Demo prijave koriste fotografije sa Wikimedia Commons-a. Nijesu snimljene u Podgorici, zato
          te prijave nose oznaku „Demo prijava“. Sve fotografije su izmijenjene: smanjene na 1600 px
          i bez metapodataka.
        </p>
        <ul className="flex flex-col gap-3">
          {DEMO_PHOTOS.map((photo) => (
            <li key={photo.fileUrl} className="flex flex-col gap-0.5">
              <a href={photo.fileUrl} className={linkClass} target="_blank" rel="noreferrer">
                {photo.title}
              </a>
              <span>
                Autor: {photo.author}. Licenca:{" "}
                {photo.license.url ? (
                  <a href={photo.license.url} className={linkClass} target="_blank" rel="noreferrer">
                    {photo.license.name}
                  </a>
                ) : (
                  photo.license.name
                )}
                . Izmijenjeno: smanjeno na 1600 px, uklonjeni metapodaci.
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  )
}
