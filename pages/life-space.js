import Head from 'next/head'

export default function LifeSpace(){
  return (
    <>
      <Head>
        <title>Life Space</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <iframe src="/life_space.html" title="Life Space" style={{width:'100%',height:'100vh',border:0}} />
    </>
  )
}
