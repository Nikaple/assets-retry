cmd="npx jest -c e2e/browserstack.config.js"
# Mobile Browsers
BROWSER=android DEVICE="Samsung Galaxy Note 4" OS_VERSION=4.4 MOBILE=1 $cmd &&
BROWSER=android DEVICE="OnePlus 6T"            OS_VERSION=9.0 MOBILE=1 $cmd &&
BROWSER=iPhone  DEVICE="iPhone 7"              OS_VERSION=10  MOBILE=1 $cmd &&
BROWSER=iPhone  DEVICE="iPhone XS"              OS_VERSION=13  MOBILE=1 $cmd &&
# PC Browsers
BROWSER=Chrome  BROWSER_VERSION=47.0 $cmd &&
BROWSER=Chrome  BROWSER_VERSION=78.0 $cmd &&
BROWSER=Edge    BROWSER_VERSION=15.0 $cmd &&
BROWSER=Edge    BROWSER_VERSION=18.0 $cmd &&
BROWSER=Firefox BROWSER_VERSION=32.0 $cmd &&
BROWSER=Firefox BROWSER_VERSION=71.0 $cmd &&
BROWSER=Safari  BROWSER_VERSION=10.0 OS="OS X" OS_VERSION=Sierra $cmd &&
BROWSER=Safari  BROWSER_VERSION=12.0 OS="OS X" OS_VERSION=Mojave $cmd &&
BROWSER=IE      BROWSER_VERSION=10.0 OS_VERSION=7 $cmd
BROWSER=IE      BROWSER_VERSION=11.0 OS_VERSION=10 $cmd