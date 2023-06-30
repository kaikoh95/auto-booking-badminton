import Image from 'next/image'
import Form from './components/form/form'
import styles from './page.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <div>
          <h1>Waitakere Badminton Auto-booker</h1>
          <h4>
            <a
              href="https://github.com/kaikoh95"
              target="_blank"
              rel="noopener noreferrer"
            >
              By Kai Kode
            </a>
          </h4>
        </div>
      </div>

      <div className={styles.center}>
        <Form />
      </div>
    </main>
  )
}
