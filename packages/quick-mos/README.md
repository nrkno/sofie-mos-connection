# Quick-MOS

An application for quick simulation of a MOS server/NCS.

## Usage

- `yarn start` to start the application

- The application will monitor the contents in the folder `/input` and send mos commands.
- Files and folders that begin with "\_" (underscore) will be ignored

- Note: quickmos and mos-gateway must be run on different machines (or docker containers) as they both try to bind to the same ports. This is a limitation in the current implementation of mos-connection
