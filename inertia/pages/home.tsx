import { Button } from '@/components/ui/button'
import { Head } from '@inertiajs/react'
import { Link } from '@tuyau/inertia/react'
import { CheckCircle, Clock, Sparkles, Star, Truck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'
import { useEffect, useState } from 'react'
import { Service } from '@/types'
import { formatIDR } from '@/lib/utils'

export default function HomePage({ services }: { services: Service[] }) {
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [current, setCurrent] = useState<number>(0)
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    if (!api) return

    const updateCarouselState = () => {
      setCurrent(api.selectedScrollSnap())
      setCount(api.scrollSnapList().length)
    }

    updateCarouselState()

    api.on('select', updateCarouselState)

    return () => {
      api.off('select', updateCarouselState)
    }
  }, [api])

  function scrollToIndex(index: number) {
    if (!api) return
    api.scrollTo(index)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <Head title="Umimaclean" />

      {/* Header */}
      <header className="sticky md:top-9 top-0 z-50 bg-background shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <img src="/images/umima-logo.png" className="h-7 w-7" />
              <h1 className="text-2xl font-bold text-foreground">UmimaClean</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-card px-4 py-12">
        <div className="text-center">
          <h2 className="mb-6 text-4xl font-bold">
            Cuci Sepatu Premium
            <span className="mt-2 block text-3xl text-accent-foreground">Antar Jemput Gratis</span>
          </h2>

          <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
            Layanan cuci sepatu profesional yang datang ke rumah Anda. Jadwalkan penjemputan, kami
            bersihkan sepatu hingga sempurna, dan antar kembali dalam 2-4 hari.
          </p>

          <div className="mb-14">
            <div className="relative inline-block">
              <img
                src="/images/shoe-cleaning-showcase.png"
                alt="Layanan cuci sepatu profesional"
                className="mx-auto rounded-3xl border-4 border-[#FCD34D] shadow-2xl"
                style={{ height: '400px', objectFit: 'cover' }}
              />
              <div className="absolute -top-3 right-0 rounded-full border-2 border-[#FCD34D] bg-background px-5 py-2 text-sm font-bold text-accent-foreground shadow-lg">
                2-4 Hari
              </div>
            </div>
          </div>

          <Link route="login.show">
            <Button
              size="lg"
              className="cursor-pointer bg-primary px-12 py-7 text-lg font-semibold shadow-lg hover:bg-primary/90"
            >
              Jadwalkan Penjemputan
            </Button>
          </Link>
        </div>
      </section>

      {/* How To Section */}
      <section className="bg-secondary/20 px-4 py-10">
        <div>
          <h3 className="mb-4 text-center text-3xl font-bold">Cara Kerja Kami</h3>
          <p className="mb-8 text-center text-muted-foreground">
            Proses mudah dalam 4 langkah sederhana
          </p>

          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-lg">
                <Clock className="h-8 w-8" />
              </div>

              <div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Jadwalkan</h3>
                <p className="text-gray-600">Pilih tanggal dan waktu penjemputan</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-lg">
                <Truck className="h-8 w-8" />
              </div>

              <div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Penjemputan</h3>
                <p className="text-gray-600">Kami jemput sepatu Anda di rumah</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-lg">
                <Sparkles className="h-8 w-8" />
              </div>

              <div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Pencucian</h3>
                <p className="text-gray-600">Kami cuci sepatu Anda hingga bersih</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl shadow-lg">
                <CheckCircle className="h-8 w-8" />
              </div>

              <div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">Pengantaran</h3>
                <p className="text-gray-600">Kami antar sepatu Anda setelah dicuci</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 py-10">
        <div>
          <h3 className="mb-4 text-center text-3xl font-bold">Layanan Kami</h3>
          <p className="mb-8 text-center text-muted-foreground">
            Perawatan sepatu dengan teknologi terdepan
          </p>

          <Carousel setApi={setApi} opts={{ slidesToScroll: 'auto' }}>
            <CarouselContent>
              {services.map((service) => (
                <CarouselItem key={service.id}>
                  <Card className="gradient-card flex h-52 flex-col justify-between gap-0 border-2 border-primary/30 transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
                    <div>
                      <CardHeader className="bg-primary/5">
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="mt-2">
                        <CardDescription className="text-base leading-relaxed">
                          {service.description}
                        </CardDescription>
                      </CardContent>
                    </div>
                    <CardFooter className="flex bg-primary/5 text-end text-lg font-semibold">
                      {service.type === 'start_from'
                        ? `Mulai dari ${formatIDR(Number(service.price))}`
                        : formatIDR(Number(service.price))}
                    </CardFooter>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="mt-2 flex justify-center space-x-2 py-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollToIndex(i)}
                className={`h-3 w-3 rounded-full ${i === current ? 'bg-black' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="gradient-hero -background px-4 py-10">
        <div className="text-center">
          <h3 className="mb-4 text-3xl font-bold">Dipercaya Ribuan Pelanggan</h3>
          <p className="-background/80 mb-8">Testimoni nyata dari pelanggan setia kami</p>

          <div className="mb-12 grid gap-8">
            <div className="flex flex-col items-center">
              <div className="mb-2 text-5xl font-bold">4.9</div>
              <div className="mb-2 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-accent" />
                ))}
              </div>
              <div className="-background/80 text-lg">Rating Rata-rata</div>
            </div>

            <div className="flex flex-col items-center">
              <div className="mb-2 text-5xl font-bold">2-4</div>
              <div className="-background/80 text-lg">Hari Pengerjaan</div>
            </div>
          </div>

          <Card className="mx-auto bg-background text-background shadow-xl">
            <CardContent>
              <div className="mb-4 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-black" />
                ))}
              </div>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground italic">
                "Rekomend bangettt, kemaren abis cuci di sini bersih bangettt"
              </p>
              <p className="text-base text-foreground font-semibold">- Rika Rahayu</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent/10 px-4 py-10">
        <div className="text-center">
          <h3 className="mb-4 text-3xl font-bold">Siap Memulai?</h3>
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
            Bergabunglah dengan ribuan pelanggan yang mempercayakan sepatu favorit mereka kepada
            kami.
          </p>

          <Link route="login.show">
            <Button
              size="lg"
              className="w-full cursor-pointer bg-primary py-7 text-lg font-semibold shadow-lg hover:bg-primary/90"
            >
              Jadwalkan Penjemputan Sekarang
            </Button>
          </Link>
        </div>
      </section>

      <footer className="gradient-hero -foreground px-4 py-10">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <img src="/images/umima-logo.png" className="h-7 w-7" />
              <h1 className="text-2xl font-bold text-foreground">UmimaClean</h1>
            </div>
          </div>

          <p className="mb-6 text-lg leading-relaxed text-foreground/80">
            Layanan cuci sepatu profesional dengan antar jemput gratis
          </p>

          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] justify-center gap-6 text-sm text-foreground/60">
            <div>
              <div>WhatsApp:</div>
              <div>+62 851-5790-0974</div>
            </div>
            <div className="flex items-center">•</div>
            <div>
              <div>Instagram:</div>
              <div>@umima.clean</div>
            </div>
          </div>

          <p className="mb-8 text-sm text-foreground/60">
            Jl. Margacinta No.132, Margasari, Kec. Buahbatu, Kota Bandung, Jawa Barat 40286
          </p>
          <p className="text-sm text-foreground/60">© 2024 UmimaClean. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  )
}
